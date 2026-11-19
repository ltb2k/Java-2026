package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.RentalPackage;
import vn.edu.mushroom.entity.enums.PackageStatus;

import java.util.List;

@Repository
public interface RentalPackageRepository extends JpaRepository<RentalPackage, Integer> {
    List<RentalPackage> findByStatusOrderByPriceAsc(PackageStatus status);
    List<RentalPackage> findAllByOrderByPriceAsc();
}
