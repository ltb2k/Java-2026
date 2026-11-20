package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.LinkCode;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface LinkCodeRepository extends JpaRepository<LinkCode, Integer> {
    Optional<LinkCode> findByCode(String code);

    Optional<LinkCode> findFirstByRentalIdAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(Integer rentalId, OffsetDateTime now);

    default Optional<LinkCode> findActiveByRentalId(Integer rentalId) {
        return findFirstByRentalIdAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(rentalId, OffsetDateTime.now());
    }
}
