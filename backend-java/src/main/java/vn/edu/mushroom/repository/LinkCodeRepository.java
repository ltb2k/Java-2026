package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.LinkCode;

import java.util.Optional;

@Repository
public interface LinkCodeRepository extends JpaRepository<LinkCode, Integer> {
    Optional<LinkCode> findByCode(String code);

    @Query("SELECT lc FROM LinkCode lc WHERE lc.rental.id = :rentalId AND lc.usedAt IS NULL AND lc.expiresAt > CURRENT_TIMESTAMP ORDER BY lc.createdAt DESC LIMIT 1")
    Optional<LinkCode> findActiveByRentalId(@Param("rentalId") Integer rentalId);
}
